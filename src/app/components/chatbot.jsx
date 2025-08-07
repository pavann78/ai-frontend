"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  User,
  RefreshCcw,
  Copy,
  Maximize,
  X,
  Mic,
  Volume2,
  Pause,
} from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const [activeMessageIdForReadAloud, setActiveMessageIdForReadAloud] =
    useState(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setInput("");
        setDots(".");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setDots("");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setDots("");
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

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleReadAloud = (text, messageId) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    const isSameMessageAndActive =
      activeMessageIdForReadAloud === messageId &&
      (window.speechSynthesis.speaking || window.speechSynthesis.paused);

    if (isSameMessageAndActive) {
      if (window.speechSynthesis.speaking && !isSpeechPaused) {
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsSpeechPaused(false);
      }
    } else {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
          utteranceRef.current = null;
        }
      }

      setActiveMessageIdForReadAloud(messageId);
      setIsSpeechPaused(false);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      utterance.onend = () => {
        setActiveMessageIdForReadAloud(null);
        setIsSpeechPaused(false);
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        setActiveMessageIdForReadAloud(null);
        setIsSpeechPaused(false);
        utteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
      utteranceRef.current = utterance;
    }
  };

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return;

    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
      setActiveMessageIdForReadAloud(null);
      setIsSpeechPaused(false);
      utteranceRef.current = null;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const repoUrl = urlParams.get("repo");

      const payload = {
        question: userMessage.content,
      };

      if (repoUrl) {
        payload.repo_url = repoUrl;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        role: "ai",
        content:
          result?.answer ||
          result?.content ||
          "Sorry, I couldn't get a response. Please try again.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching from the API:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          content:
            "Sorry, something went wrong. Please check your connection or try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height =
        e.target.value.trim() === ""
          ? "48px"
          : textareaRef.current.scrollHeight + "px";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel();
      setActiveMessageIdForReadAloud(null);
      setIsSpeechPaused(false);
      utteranceRef.current = null;
    }
    setMessages([
      {
        id: 1,
        role: "ai",
        content: "New conversation started! How can I assist you?",
      },
    ]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      alert("Copied to clipboard!");
    });
  };

  const chatWindowClass = `
    ${isOpen ? "flex" : "hidden"}
    ${
      isFullscreen
        ? "fixed inset-0 w-full h-full"
        : "fixed bottom-20 right-5 w-[440px] h-[70vh] max-h-[700px]"
    }
    flex-col bg-white shadow-2xl rounded-2xl transition-all duration-300 ease-in-out z-50
  `;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 bg-black hover:bg-gray-800 text-white p-4 rounded-full shadow-lg z-40 transition-transform transform hover:scale-110"
      >
        <Bot size={28} className="blinking-icon" />
      </button>

      <div className={chatWindowClass}>
        <div className="flex items-center justify-between p-4 border-b border-gray-300 rounded-t-2xl bg-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Got Questions?
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewConversation}
              className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              <Maximize size={18} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-white">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                } gap-1`}
              >
                <div
                  className={`flex items-end gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } w-full`}
                >
                  {message.role === "ai" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Bot size={20} />
                    </div>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gray-100 rounded-br-none"
                        : "bg-gray-100 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} />
                    </div>
                  )}
                </div>

                {message.role === "ai" && (
                  <div className="flex items-center gap-2 mt-1 ml-11">
                    <button
                      onClick={() =>
                        handleReadAloud(message.content, message.id)
                      }
                      className="p-1 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {activeMessageIdForReadAloud === message.id &&
                      !isSpeechPaused ? (
                        <Pause size={16} />
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="p-1 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-end gap-3 justify-start">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-300 bg-gray-100 rounded-b-2xl">
          <div className="flex items-end">
            <button
              onClick={toggleVoiceInput}
              className={`w-10 h-10 mr-2 rounded-full flex items-center justify-center transition-all
                ${
                  isListening
                    ? "bg-gray-500 text-white glowing-mic-animation"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }
                disabled:bg-gray-300 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              <Mic size={20} />
            </button>

            {isListening ? (
              <div className="flex-1 bg-white border border-gray-300 text-black rounded-xl py-3 px-5 flex items-center ">
                <span className="text-gray-500 italic">Listening{dots}</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 bg-white border border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-black rounded-xl py-3 px-5 resize-none transition-colors overflow-y-auto hide-scrollbar h-[48px]  max-h-[150px]"
                disabled={isLoading}
              />
            )}

            <div className="ml-3 flex flex-col items-end">
              {!isListening && (
                <span className="text-xs text-gray-500 mb-1">
                  {input.length}/2000
                </span>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || input.trim() === ""}
                className="w-10 h-10 bg-gray-500 text-white rounded-lg flex items-center justify-center disabled:bg-gray-300 hover:bg-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </>
  );
}
