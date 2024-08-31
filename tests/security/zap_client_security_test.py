#!/usr/bin/env python

import time
from zapv2 import ZAPv2

# The URL of the application we want to test
target = 'http://localhost:5000'

# Change this if your ZAP instance is running on a different host and port
zap = ZAPv2(proxies={'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'})

# Proxy the request via ZAP
print('Accessing target {}'.format(target))
zap.urlopen(target)
time.sleep(2)

print('Spidering target {}'.format(target))
scan_id = zap.spider.scan(target)
time.sleep(2)
while int(zap.spider.status(scan_id)) < 100:
    print('Spider progress %: {}'.format(zap.spider.status(scan_id)))
    time.sleep(2)

print('Spider completed')

# Give the passive scanner a chance to finish
time.sleep(5)

print('Scanning target {}'.format(target))
scan_id = zap.ascan.scan(target)
while int(zap.ascan.status(scan_id)) < 100:
    print('Scan progress %: {}'.format(zap.ascan.status(scan_id)))
    time.sleep(5)

print('Scan completed')

# Report the results
print('Hosts: {}'.format(', '.join(zap.core.hosts)))
print('Alerts: ')
alerts = zap.core.alerts()
for alert in alerts:
    print('  {}: {}'.format(alert['risk'], alert['alert']))

# Specific tests based on the App.js content

# Test authentication endpoints
auth_endpoints = ['/auth/google', '/auth/user', '/auth/logout']
for endpoint in auth_endpoints:
    print(f'Testing authentication endpoint: {endpoint}')
    zap.httpfuzzer.scan(target + endpoint, 'GET')

# Test API endpoints
api_endpoints = ['/items', '/items/1']  # Add more as needed
for endpoint in api_endpoints:
    print(f'Testing API endpoint: {endpoint}')
    zap.httpfuzzer.scan(target + endpoint, 'GET')
    zap.httpfuzzer.scan(target + endpoint, 'POST', '{"name": "Test Item"}')

# Test for XSS in custom text analysis
xss_payload = '<script>alert("XSS")</script>'
print('Testing for XSS in custom text analysis')
zap.httpfuzzer.scan(target, 'POST', f'customText={xss_payload}')

# Test for CSRF
print('Testing for CSRF vulnerabilities')
zap.csrf.scan(target)

# Generate HTML report
print('Generating HTML report')
report_html = zap.core.htmlreport()
with open('zap_report.html', 'w') as f:
    f.write(report_html)

print('ZAP security test completed. Check zap_report.html for detailed results.')