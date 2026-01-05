FROM php:8.2-apache

# Fix Apache port + ServerName
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && sed -i 's/Listen 80/Listen 8081/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/' /etc/apache2/sites-enabled/000-default.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8081>/g' /etc/apache2/sites-enabled/*.conf || true

# Enable headers module
RUN a2enmod headers

# Set caching headers for static content
RUN cat <<'EOF' >> /etc/apache2/conf-available/cache-headers.conf
<IfModule mod_headers.c>
    <FilesMatch "\.(html|css|js|json|png|jpg|jpeg|gif|ico)$">
        Header set Cache-Control "public, max-age=172800, must-revalidate"
    </FilesMatch>
</IfModule>
EOF
RUN a2enconf cache-headers

# Copy application source into Apache docroot
COPY src/ /var/www/html/

# OpenShift: allow arbitrary UID access
RUN chgrp -R 0 /var/www \
    && chmod -R g+rwX /var/www

EXPOSE 8081

CMD ["apache2-foreground"]
