#!/usr/bin/env python3
import os
import json

def get_structure(path=".", max_depth=10, current_depth=0):
    """Retourne la structure en dictionnaire"""
    if current_depth >= max_depth:
        return {}
    
    structure = {}
    
    try:
        items = sorted(os.listdir(path))
        items = [item for item in items if not item.startswith('.') and not item.endswith('~')]
        
        for item in items:
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                structure[item + "/"] = get_structure(item_path, max_depth, current_depth + 1)
            else:
                structure[item] = "file"
                
    except PermissionError:
        structure["[Accès refusé]"] = "error"
        
    return structure

def save_structure():
    """Sauvegarde la structure dans différents formats"""
    structure = get_structure()
    
    # JSON
    with open("structure.json", "w", encoding="utf-8") as f:
        json.dump(structure, f, indent=2, ensure_ascii=False)
    
    # TXT (arbre visuel)
    with open("structure.txt", "w", encoding="utf-8") as f:
        f.write("Structure du site :\n")
        print_tree(structure, f)
    
    print("✅ Fichiers créés : structure.json et structure.txt")

def print_tree(data, file, prefix=""):
    """Écrit l'arbre dans un fichier"""
    items = list(data.items())
    for i, (name, content) in enumerate(items):
        is_last = i == len(items) - 1
        current_prefix = "└── " if is_last else "├── "
        next_prefix = prefix + ("    " if is_last else "│   ")
        
        file.write(f"{prefix}{current_prefix}{name}\n")
        
        if isinstance(content, dict) and content:
            print_tree(content, file, next_prefix)

if __name__ == "__main__":
    save_structure()