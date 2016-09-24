cd ~
sudo apt-get -y upgrade
sudo apt-get -y update

# update iptables to accept MQTT connections
sudo /sbin/iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 3000 -j ACCEPT
sudo /sbin/iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 1883 -j ACCEPT

# install the latest version of Redis

sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:chris-lea/redis-server
sudo apt-get -y update
sudo apt-get install -y redis-server
sudo service redis-server restart


# install latest version of Node.js
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs


# configure MongoDB
sudo cp /opt/bitnami/mongodb/mongodb.conf /opt/bitnami/mongodb/mongodb.bak.conf
sudo sed 's/auth = true/noauth = true/' -i /opt/bitnami/mongodb/mongodb.conf
sudo /opt/bitnami/mongodb/scripts/ctl.sh stop
sudo /opt/bitnami/mongodb/scripts/ctl.sh start
sudo mongo < /opt/bitnami/apps/dreamfactory/df-iot/config/df-iot-mongo.js

# configure Freeboard
sudo git clone https://github.com/Freeboard/freeboard.git /opt/bitnami/apps/freeboard/htdocs
sudo mkdir /opt/bitnami/apps/freeboard/conf

cd /opt/bitnami/apps/freeboard/htdocs
sudo npm install -g grunt-cli
sudo npm install
sudo grunt

sudo cp /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/conf/httpd-prefix.conf /opt/bitnami/apps/freeboard/conf
sudo cp /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/conf/httpd-app.conf /opt/bitnami/apps/freeboard/conf

sudo cp /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.bak
sudo echo "Include \"/opt/bitnami/apps/freeboard/conf/httpd-prefix.conf\"" >> /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
sudo sh /opt/bitnami/ctlscript.sh restart apache

IP_ADDR=$(echo `ifconfig eth0 2>/dev/null|awk '/inet addr:/ {print $2}'|sed 's/addr://'`)
sudo cp /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/dashboard.json.template /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/dashboard.json
sudo sed -i "s/DreamFactory_URL/$IP_ADDR/" /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/dashboard.json
sudo mkdir /opt/bitnami/apps/dreamfactory/htdocs/storage/app/Freeboard
sudo mv /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/dashboard.json /opt/bitnami/apps/dreamfactory/htdocs/storage/app/Freeboard/
IP_ADDR=

# install Mosca
cd /opt/bitnami/apps/dreamfactory/df-iot
sudo apt-get install -y jq
sudo npm install
sudo npm install mqtt -g

# configure Mosca
cd /opt/bitnami/apps/dreamfactory/df-iot/config
token=$(curl  -X POST "http://localhost/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "bitnami", "remember_me": true }' -H "Content-Type: application/json" | jq '{session_token}' | jq '.session_token' | tr -d '"')
sudo cp config.json.template config.json
sudo sed -i "s/DreamFactory_URL/localhost/" config.json
sudo sed -i "s/DreamFactory_TOKEN/$token/" config.json
sudo cp config.json ..
token=
