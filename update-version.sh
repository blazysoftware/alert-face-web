#!/bin/bash

# Script para atualizar automaticamente a versão antes do commit
echo "🔄 Atualizando informações de versão..."

# Gera o arquivo version.json com as informações do último commit
git log -1 --format='{"commit": "%H", "shortCommit": "%h", "date": "%ai", "message": "%s", "author": "%an"}' > version.json

echo "✅ Arquivo version.json atualizado!"

# Se foi passado um argumento, faz commit e push
if [ "$1" = "--commit" ]; then
    echo "📝 Fazendo commit das alterações..."
    git add .
    git commit -m "chore: Atualiza versão e implementa footer com git version"
    
    echo "🚀 Enviando para repositório remoto..."
    git push origin main
    
    echo "✅ Deploy concluído!"
else
    echo "💡 Para fazer commit e push automático, use: ./update-version.sh --commit"
fi