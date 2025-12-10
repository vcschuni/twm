FROM php:8.2-apache

# Fix Apache privileged port issue and ServerName warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf && \
    sed -i 's/Listen 80/Listen 8081/' /etc/apache2/ports.conf && \
    sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/' /etc/apache2/sites-enabled/000-default.conf

# If you have additional vhosts in sites-enabled, update them too
RUN sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/g' /etc/apache2/sites-enabled/*.conf || true

# OpenShift runs containers as random non-root UID
# Make sure Apache can write to logs/cache/session directories
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www

EXPOSE 8081

CMD ["apache2-foreground"]
