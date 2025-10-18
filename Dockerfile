FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos da aplicação
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY 404.html /usr/share/nginx/html/
COPY 50x.html /usr/share/nginx/html/

# Criar diretórios necessários
RUN mkdir -p /var/run/nginx
RUN mkdir -p /var/log/nginx

# Definir permissões
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /var/run/nginx
RUN chmod -R 755 /usr/share/nginx/html

# Health check usando o endpoint personalizado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expor porta
EXPOSE 80

# Labels para metadados
LABEL maintainer="BlazySoftware"
LABEL description="AI Face Detection Web Application"
LABEL version="1.0"

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]