# Freeboard configuration


sudo git clone https://github.com/Freeboard/freeboard.git /opt/bitnami/apps/freeboard
sudo mkdir /opt/bitnami/apps/freeboard/htdocs
sudo mkdir /opt/bitnami/apps/freeboard/conf

sudo cd /opt/bitnami/apps/freeboard
sudo npm install -g grunt-cli
sudo npm install
sudo grunt

sudo cp /opt/bitnami/apps/df-iot/config/freeboard/conf/httpd-prefix.conf /opt/bitnami/apps/freeboard/conf
sudo cp /opt/bitnami/apps/df-iot/config/freeboard/conf/httpd-app.conf /opt/bitnami/apps/freeboard/conf

sudo echo "Include \"/opt/bitnami/apps/myapp/conf/httpd-prefix.conf\"" >> /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
sudo sh /opt/bitnami/ctlscript.sh restart apache