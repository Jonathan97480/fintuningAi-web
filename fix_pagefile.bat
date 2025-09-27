@echo off
echo 🔧 Configuration du fichier de pagination Windows pour le fine-tuning...
echo.

echo Étape 1: Vérification des paramètres actuels...
wmic pagefile list /format:list
echo.

echo Étape 2: Configuration d'un fichier de pagination système géré automatiquement...
wmic computersystem set AutomaticManagedPagefile=True
echo.

echo Étape 3: Redémarrage recommandé...
echo ⚠️  Redémarrez votre ordinateur pour appliquer les changements.
echo.
echo Instructions alternatives si le problème persiste :
echo 1. Ouvrez "Paramètres système avancés" (Win+R → sysdm.cpl → Avancé)
echo 2. Cliquez sur "Paramètres" dans "Performances"
echo 3. Onglet "Avancé" → "Mémoire" → "Modifier"
echo 4. Décochez "Taille gérée automatiquement"
echo 5. Définissez "Taille personnalisée" avec :
echo    - Initiale: 16384 MB (16 GB)
echo    - Maximum: 32768 MB (32 GB) ou plus selon votre RAM
echo 6. Cliquez OK et redémarrez
echo.

pause