# Grab packages
execute 'apt_update' do
	command "apt-get update"
end
package "apache2"
package "libapache2-mod-php5"
package "mysql-server"
package "libapache2-mod-auth-mysql"
package "php5-mysql"
package "nodejs"

# Setup LAMP
cookbook_file "000-default.conf" do
  path "/etc/apache2/sites-available/000-default.conf"
end
cookbook_file "apache2.conf" do
  path "/etc/apache2/apache2.conf"
end
execute 'apache_restart' do
  command 'service apache2 restart'
end
execute 'php_enable' do
	command 'a2enmod php5'
	command 'service apache2 restart'
end

# Setup nodejs