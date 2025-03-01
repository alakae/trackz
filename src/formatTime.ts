export const formatTime = (timestamp: Date | undefined) => {
  if (!timestamp) return "";
  return timestamp.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
