FUNCTION_DIR=`pwd`
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Rewriting workspace dependencies for $FUNCTION_DIR"
echo "Using script dir $SCRIPT_DIR"

(cd $SCRIPT_DIR && pnpm run build)
echo "Running rewrite-workspace-deps.js"
node $SCRIPT_DIR/lib/rewrite-workspace-deps.js $FUNCTION_DIR