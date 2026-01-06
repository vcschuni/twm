FROM docker.osgeo.org/geoserver:2.28.0

# OpenShift runs with a random UID → fix permissions
USER root
RUN chgrp -R 0 /opt/geoserver && \
    chmod -R g=u /opt/geoserver

USER 1001

EXPOSE 8080
