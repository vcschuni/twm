# TWM Public

This repository contains the **TWM Public** application, deployed in a BCGov-standard container setup.

## Architecture

- **Nginx** (port 8080): reverse proxy, rate limiting
- **Apache/PHP** (port 8081): serves TWM application

## Running Locally

```bash
docker-compose up --build
