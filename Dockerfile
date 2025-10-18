FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Remover configuração padrão do nginx
RUN rm /etc/nginx/nginx.conf

# Copiar arquivos da aplicação
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/
COPY .env.example /usr/share/nginx/html/

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Criar diretório para PID do nginx
RUN mkdir -p /var/run/nginx

# Definir permissões
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expor porta
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]