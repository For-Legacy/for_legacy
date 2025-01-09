
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

# Set port for Replit
port = int(os.environ.get('PORT', 8080))

# Create server with SimpleHTTPRequestHandler
server = HTTPServer(('0.0.0.0', port), SimpleHTTPRequestHandler)
print(f'Server running on port {port}')

# Start the server
server.serve_forever()
