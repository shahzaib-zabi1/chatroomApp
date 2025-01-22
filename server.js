const express = require("express");
const path = require("path");
const os = require("os");
const readline = require("readline");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);


function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const address of addresses) {
            if (address.family === "IPv4" && !address.internal) {
                return address.address;
            }
        }
    }
    return null;
}


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Would you like to run the server on localhost or IP address? (Enter "localhost" or "ip"): ', (choice) => {
    const PORT = 5000;
    let host;

    if (choice.toLowerCase() === "ip") {
        host = getLocalIP(); // Use IP address if chosen
        if (!host) {
            console.log("Local IP not found. Falling back to localhost.");
            host = "localhost"; // Fall back to localhost if no IP is found
        }
    } else {
        host = "localhost"; // Default to localhost if the user chooses
    }

    // Serve static files from the public folder
    app.use(express.static(path.join(__dirname, "public")));

    // Handle socket connections
    io.on("connection", function (socket) {
        console.log("New user connected");

        socket.on("newuser", function (username) {
            console.log(`${username} joined`);
            socket.broadcast.emit("update", `${username} joined the conversation`);
        });

        socket.on("exituser", function (username) {
            console.log(`${username} left`);
            socket.broadcast.emit("update", `${username} left the conversation`);
        });

        socket.on("chat", function (message) {
            console.log("Chat message:", message);
            socket.broadcast.emit("chat", message);
        });
    });



    // Start the server and bind to all interfaces (0.0.0.0)
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running. Access it at http://${host}:${PORT}`);
    });

    rl.close();
});
