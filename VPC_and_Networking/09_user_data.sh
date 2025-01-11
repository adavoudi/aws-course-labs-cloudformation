#!/bin/bash
# This script installs a web server and creates a simple webpage displaying
# the instance ID and availability zone of the instance.

# Update the package repository and install Apache HTTP Server
yum update -y
yum install -y httpd

# Start the Apache service and enable it to run on boot
systemctl start httpd
systemctl enable httpd

# Fetch the IMDSv2 token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Fetch instance metadata (Instance ID and Availability Zone) using the token
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
AVAILABILITY_ZONE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)

# Create a simple HTML file to display the metadata
cat <<EOF | tee /var/www/html/index.html
<html>
    <head>
        <title>Instance Metadata</title>
    </head>
    <body>
        <h1>Welcome to the Web Server!</h1>
        <p><b>Instance ID:</b> $INSTANCE_ID</p>
        <p><b>Availability Zone:</b> $AVAILABILITY_ZONE</p>
    </body>
</html>
EOF

# Open HTTP (port 80) in the firewall
firewall-cmd --add-service=http --permanent
firewall-cmd --reload

# Restart Apache to apply changes
systemctl restart httpd

echo "Web server setup complete. Visit the instance's public IP to see the webpage."
