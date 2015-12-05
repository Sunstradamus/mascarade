# Grab packages
execute 'apt_update' do
    command "apt-get update"
end
package "apache2"
package "libapache2-mod-php5"
package "mysql-server"
package "libapache2-mod-auth-mysql"
package "php5-mysql"
package "phpmyadmin"
package "nodejs"
package "npm"

# Setup LAMP
cookbook_file "000-default.conf" do
    path "/etc/apache2/sites-available/000-default.conf"
end
cookbook_file "apache2.conf" do
    path "/etc/apache2/apache2.conf"
end
cookbook_file "my.cnf" do
    path "/etc/mysql/my.cnf"
end
cookbook_file "php.ini" do
    path "/etc/php5/apache2/php.ini"
end
execute 'mysql_restart' do
    command 'service mysql restart'
end
execute 'php_enable' do
    command 'a2enmod php5'
    command 'service apache2 restart'
end
execute 'php_mcrypt' do
    command 'php5enmod mcrypt'
    command 'service apache2 restart'
end
execute 'mysql_config' do
    command 'cat /home/vagrant/project/sql/setup.sql | mysql -u root'
end
execute 'mysql_import' do
    command 'cat /home/vagrant/project/sql/import.sql | mysql -uwebapp -pSekretPassWord'
end

# Setup nodejs
execute 'nodejs_config' do
    command 'ln -s `which nodejs` /usr/bin/node'
end
execute 'install_forever' do
    command 'npm install forever -g'
end