#!/bin/bash

OUTPUT_FILE="backend-export.txt"

> "$OUTPUT_FILE"

write_file() {
    local file="$1"
    echo "================================================================================" >> "$OUTPUT_FILE"
    echo "FILE: $file" >> "$OUTPUT_FILE"
    echo "================================================================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
}

cat << EOF >> "$OUTPUT_FILE"
BACKEND CODE EXPORT
Generated: $(date)
EOF

# Prisma
[ -f prisma/schema.prisma ] && write_file prisma/schema.prisma
 

# src/lib
for f in lib/*.ts; do
    [ -f "$f" ] && write_file "$f"
done

# Validators
for f in validators/*.ts; do
    [ -f "$f" ] && write_file "$f"
done

# DAL
for f in dal/*.ts; do
    [ -f "$f" ] && write_file "$f"
done

# Services
for f in services/*.ts; do
    [ -f "$f" ] && write_file "$f"
done

# Auth
[ -f auth.ts ] && write_file auth.ts
[ -f middleware.ts ] && write_file middleware.ts

# API routes
find app/api -type f -name "*.ts" 2>/dev/null | sort | while read -r f; do
    write_file "$f"
done

echo "END OF EXPORT" >> "$OUTPUT_FILE"

echo "Export complete → $OUTPUT_FILE"
