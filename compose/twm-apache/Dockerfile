FROM php:8.2-apache

# Fix Apache port + ServerName
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8080>/' /etc/apache2/sites-enabled/000-default.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8080>/g' /etc/apache2/sites-enabled/*.conf || true

# Copy custom apache conf
COPY cache-headers.conf /etc/apache2/conf-available/cache-headers.conf

# Enable mods / configs
RUN a2enmod headers
RUN a2enconf cache-headers

# Copy application source into Apache docroot
COPY src/ /var/www/html/

# OpenShift: allow arbitrary UID access
RUN chgrp -R 0 /var/www \
    && chmod -R g+rwX /var/www

EXPOSE 8080

CMD ["apache2-foreground"]
