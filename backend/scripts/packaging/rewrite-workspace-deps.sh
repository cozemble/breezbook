FUNCTION_DIR=`pwd`
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Rewriting workspace dependencies for $FUNCTION_DIR"
echo "Using script dir $SCRIPT_DIR"

npx ts-node --esm $SCRIPT_DIR/rewrite-workspace-deps.ts $FUNCTION_DIR

