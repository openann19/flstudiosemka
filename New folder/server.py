#!/usr/bin/env python3
import http.server
import socketserver
import os

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def send_header(self, keyword, value):
        # Override Content-Type header for text files to include charset
        if keyword.lower() == 'content-type' and value.startswith('text/'):
            if not 'charset=' in value:
                value += '; charset=utf-8'
        super().send_header(keyword, value)

# Use port 8000
PORT = 8000

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
