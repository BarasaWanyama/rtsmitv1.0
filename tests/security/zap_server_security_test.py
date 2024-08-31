#!/usr/bin/env python

import time
from zapv2 import ZAPv2
import requests

# The URL of the server we want to test
target = 'http://localhost:5000'  # Adjust this to your server's address

zap = ZAPv2(proxies={'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'})

# Spider the target
print('Spidering target {}'.format(target))
scan_id = zap.spider.scan(target)
while int(zap.spider.status(scan_id)) < 100:
    print('Spider progress %: {}'.format(zap.spider.status(scan_id)))
    time.sleep(2)

print('Spider completed')

# Active Scan
print('Scanning target {}'.format(target))
scan_id = zap.ascan.scan(target)
while int(zap.ascan.status(scan_id)) < 100:
    print('Scan progress %: {}'.format(zap.ascan.status(scan_id)))
    time.sleep(5)

print('Scan completed')

# Test specific API endpoints
api_endpoints = [
    '/',
    '/auth/google',
    '/auth/google/callback',
    '/auth/user',
    '/auth/logout',
    '/api/items',
    '/api/social-media-posts',
    '/api/social-media-data'
]

# Function to create a session and authenticate
def authenticate():
    session = requests.Session()
    # Simulate Google OAuth login - this is a placeholder and won't actually authenticate
    session.get(f"{target}/auth/google")
    return session

authenticated_session = authenticate()

for endpoint in api_endpoints:
    full_url = target + endpoint
    print(f'Testing API endpoint: {full_url}')
    
    # Test GET requests
    zap.httpfuzzer.scan(full_url, 'GET')
    
    # Test POST requests for relevant endpoints
    if endpoint in ['/auth/logout', '/api/items', '/api/social-media-posts']:
        zap.httpfuzzer.scan(full_url, 'POST', '{"test": "data"}')

# Test authentication bypass
print('Testing authentication bypass')
unauthenticated_endpoints = ['/api/items', '/api/social-media-posts', '/api/social-media-data']
for endpoint in unauthenticated_endpoints:
    response = requests.get(f"{target}{endpoint}")
    if response.status_code != 401:
        print(f"Potential authentication bypass at {endpoint}")

# Test for CSRF vulnerabilities
print('Testing for CSRF vulnerabilities')
csrf_endpoints = ['/auth/logout', '/api/items', '/api/social-media-posts']
for endpoint in csrf_endpoints:
    zap.csrf.scan(f"{target}{endpoint}")

# Test for XSS vulnerabilities
print('Testing for XSS vulnerabilities')
xss_payload = '<script>alert("XSS")</script>'
for endpoint in api_endpoints:
    zap.httpfuzzer.scan(f"{target}{endpoint}", 'GET', f'param={xss_payload}')

# Test for SQL Injection (for MongoDB)
print('Testing for NoSQL Injection')
nosql_payloads = ['{"$gt": ""}', '{"$where": "this.password == this.username"}']
for payload in nosql_payloads:
    zap.httpfuzzer.scan(f"{target}/api/items", 'GET', f'query={payload}')

# Test for sensitive data exposure
print('Testing for sensitive data exposure')
sensitive_endpoints = ['/auth/user', '/api/social-media-data']
for endpoint in sensitive_endpoints:
    response = authenticated_session.get(f"{target}{endpoint}")
    if 'password' in response.text or 'token' in response.text:
        print(f"Potential sensitive data exposure at {endpoint}")

# Test for insecure direct object references
print('Testing for insecure direct object references')
zap.httpfuzzer.scan(f"{target}/api/items/1", 'GET')
zap.httpfuzzer.scan(f"{target}/api/items/2", 'GET')
zap.httpfuzzer.scan(f"{target}/api/items/admin", 'GET')

# Generate report
print('Generating HTML report')
report_html = zap.core.htmlreport()
with open('zap_server_report.html', 'w') as f:
    f.write(report_html)

print('ZAP security test for server completed. Check zap_server_report.html for detailed results.')