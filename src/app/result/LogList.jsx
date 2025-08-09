import { AnimatePresence, motion } from "framer-motion";

export default function Logs({ logs }) {
  return (
    <AnimatePresence mode="popLayout">
      {logs.map((logEntry, index) => {
        const IconComponent = logEntry.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2 }}
            whileHover={{
              scale: 1.02,
              //   filter: "brightness(1.05)",
              transition: { duration: 0.15 },
            }}
            className={`flex items-start space-x-3 p-4 rounded-lg mb-3 transition-colors duration-200 cursor-pointer ${
              logEntry.type === "success"
                ? "bg-green-50 hover:bg-green-100 border-l-4 border-green-400 "
                : logEntry.type === "error"
                ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-400 "
                : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400 "
            }`}
          >
            <IconComponent
              className={`w-5 h-5 mt-0.5 ${
                logEntry.type === "success"
                  ? "text-green-600"
                  : logEntry.type === "error"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            />
            <div className="flex-1">
              <p className="text-gray-800 font-medium">{logEntry.message}</p>
              {/* <p className="text-gray-800 font-medium">{logEntry.timestamp}</p> */}
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
