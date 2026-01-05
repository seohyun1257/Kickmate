import http from "http";

http
  .createServer((req, res) => {
    if (req.url === "/sse") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "http://localhost:5173",
      });

      let count = 0;

      const interval = setInterval(() => {
        count++;
        res.write(`data: ${count}\n\n`);
      }, 5000);

      req.on("close", () => {
        clearInterval(interval);
        console.log("client disconnected");
      });
    }
  })
  .listen(3000, () => {
    console.log("SSE server running on http://localhost:3000");
  });
