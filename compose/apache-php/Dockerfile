FROM php:8.2-apache

# Fix Apache privileged port issue and ServerName warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && sed -i 's/Listen 80/Listen 8081/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/' /etc/apache2/sites-enabled/000-default.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/g' /etc/apache2/sites-enabled/*.conf || true

# Make /var/www writable by arbitrary UID
RUN chmod -R g+rwX /var/www \
    && chgrp -R 0 /var/www

EXPOSE 8081

CMD ["apache2-foreground"]
