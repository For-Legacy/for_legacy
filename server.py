
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import csv
from datetime import datetime
from urllib.parse import parse_qs

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/submit-guide-form':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            form_data = json.loads(post_data.decode('utf-8'))
            
            # Ensure the leads directory exists
            if not os.path.exists('leads'):
                os.makedirs('leads')
            
            # Append to CSV file
            csv_file = 'leads/guide_submissions.csv'
            is_new_file = not os.path.exists(csv_file)
            
            with open(csv_file, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['name', 'email', 'company', 'phone', 'timestamp'])
                if is_new_file:
                    writer.writeheader()
                writer.writerow(form_data)
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success'}).encode())
            return
        
        return self.send_error(404)

    def do_GET(self):
        return SimpleHTTPRequestHandler.do_GET(self)

# Set port for Replit
port = int(os.environ.get('PORT', 8080))

# Create server with CustomHandler
server = HTTPServer(('0.0.0.0', port), CustomHandler)
print(f'Server running on port {port}')

# Start the server
server.serve_forever()
