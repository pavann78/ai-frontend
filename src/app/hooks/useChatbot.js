// src/hooks/useChatbot.js

"use client";

import { useState, useEffect, useRef } from "react";

export const useChatbot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      content: "Hello! I'm a friendly AI assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dots, setDots] = useState("");
  const [activeMessageIdForReadAloud, setActiveMessageIdForReadAloud] = useState(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null); // --- NEW STATE for copy feedback ---

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInput(transcript);
      };
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : "."));
      }, 500);
    } else {
      setDots("");
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const cancelSpeech = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
    }
    setActiveMessageIdForReadAloud(null);
    setIsSpeechPaused(false);
    utteranceRef.current = null;
  };

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;
    cancelSpeech();

    const userMessage = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "48px";

    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const repoUrl = urlParams.get("repo");
      const payload = { question: userMessage.content };
      if (repoUrl) payload.repo_url = repoUrl;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const aiMessage = {
        id: Date.now() + 1,
        role: "ai",
        content: result?.answer || result?.content || "Sorry, I couldn't get a response.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching from the API:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          content: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadAloud = (text, messageId) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }
    const isSameMessageAndActive = activeMessageIdForReadAloud === messageId && (window.speechSynthesis.speaking || window.speechSynthesis.paused);

    if (isSameMessageAndActive) {
      if (window.speechSynthesis.speaking && !isSpeechPaused) {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      }
    } else {
      cancelSpeech();
      setActiveMessageIdForReadAloud(messageId);
      setIsSpeechPaused(false);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => cancelSpeech();
      utterance.onerror = () => cancelSpeech();
      window.speechSynthesis.speak(utterance);
      utteranceRef.current = utterance;
    }
  };
  
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
    }
  };

  const handleNewConversation = () => {
    cancelSpeech();
    setMessages([{ id: 1, role: "ai", content: "New conversation started! How can I assist you?" }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "48px";
  };
  
  // --- UPDATED: handleCopyMessage now gives visual feedback ---
  const handleCopyMessage = (messageId, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000); // Revert the icon back to normal after 2 seconds
    });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = e.target.value.trim() === "" ? "48px" : `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    messages,
    input,
    isLoading,
    isListening,
    dots,
    activeMessageIdForReadAloud,
    isSpeechPaused,
    copiedMessageId, // --- EXPORT new state ---
    messagesEndRef,
    textareaRef,
    handleSend,
    handleInputChange,
    handleKeyPress,
    handleNewConversation,
    handleCopyMessage,
    toggleVoiceInput,
    handleReadAloud,
  };
};