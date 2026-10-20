#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Protección activa contra eliminación accidental de volúmenes en CentralPhone
# Agregar a ~/.bashrc o ~/.zshrc en el servidor:
# source /ruta/a/centralphone/scripts/prevent-destructive-docker.sh
# -----------------------------------------------------------------------------

docker() {
    local args_str="$*"
    if [[ "$args_str" =~ (^|[[:space:]])down([[:space:]]|$) ]] && { [[ "$args_str" =~ (^|[[:space:]])-v([[:space:]]|$) ]] || [[ "$args_str" =~ (^|[[:space:]])--volumes([[:space:]]|$) ]]; }; then
        echo -e "\n\033[1;31m🛑 [BLOQUEO DE SEGURIDAD - CENTRALPHONE]\033[0m"
        echo -e "\033[1;33mSe ha intentado ejecutar 'docker compose down' con flag de eliminación de volúmenes (-v / --volumes).\033[0m"
        echo -e "\033[1;33mEsta operación destruiría de forma irreversible la base de datos de PostgreSQL (ventas, inventario y cajas).\033[0m\n"
        echo -e "\033[1;36mComandos recomendados:\033[0m"
        echo -e "  \033[1;32m* Detener contenedores preservando datos: docker compose down\033[0m"
        echo -e "  \033[1;32m* Reconstruir tras cambios de código:     docker compose up -d --build\033[0m\n"
        return 1
    fi

    command docker "$@"
}

echo "🛡️ Protección de volúmenes Docker activada para CentralPhone en Bash/Zsh."
