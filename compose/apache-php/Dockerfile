FROM php:8.2-apache

# Enable Apache mods
RUN a2enmod rewrite

# Copy TWM source code
COPY src/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose Apache port
EXPOSE 8081
