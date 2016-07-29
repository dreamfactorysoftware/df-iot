# Freeboard configuration

sudo git clone https://github.com/Freeboard/freeboard.git /opt/bitnami/apps/freeboard/htdocs
sudo mkdir /opt/bitnami/apps/freeboard/htdocs
sudo mkdir /opt/bitnami/apps/freeboard/conf

cd /opt/bitnami/apps/freeboard
sudo npm install -g grunt-cli
sudo npm install
sudo grunt

sudo cp /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/conf/httpd-prefix.conf /opt/bitnami/apps/freeboard/conf
sudo cp /opt/bitnami/apps/dreamfactory/df-iot/config/freeboard/conf/httpd-app.conf /opt/bitnami/apps/freeboard/conf

sudo echo "Include \"/opt/bitnami/apps/freeboard/conf/httpd-prefix.conf\"" >> /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
sudo sh /opt/bitnami/ctlscript.sh restart apache