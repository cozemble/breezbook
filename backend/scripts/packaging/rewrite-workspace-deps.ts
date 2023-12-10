import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import { exec } from 'child_process'

const functionDir = '.'

function readPackageJson(path: string): PackageJson {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const pkg = readPackageJson(`${functionDir}/package.json`)

function shell(line: string, debug = false): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (debug) {
      console.log({ line })
    }
    exec(line, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      if (stdout !== '') {
        console.log(stdout)
      }
      if (stderr !== '') {
        console.log(stderr)
      }
      console.log(`Done: ${line}`)
      resolve(stdout)
    })
  })
}

function splitLines(str: string): string[] {
  return str.split('\n')
}

type WorkspaceDependency = { name: string; relativePath: string }

type Dependencies = { [name: string]: string }

interface PackageJson {
  name: string
  files?: string[]
  dependencies: Dependencies
  devDependencies?: Dependencies
}

const buildLineRegex = /(@breezbook.*?):build: > (.*?) build (.*)/

function filterBuildCommandLines(buildOutput: string[]): string[] {
  return buildOutput.filter((s) => s.match(buildLineRegex))
}

async function findParent(filename: string, dir = process.cwd()): Promise<string> {
  if (fs.existsSync(`${dir}/${filename}`)) {
    return dir
  }
  return findParent(filename, path.dirname(dir))
}

function workspaceDependencyFromBuildLine(
  rootDir: string,
  buildCommandLine: string,
): WorkspaceDependency {
  const match = buildCommandLine.match(buildLineRegex)
  if (!match) {
    throw new Error(`Could not parse build line ${buildCommandLine}`)
  }
  const absolutePath = match[3]
  const relativePath = absolutePath.substring(rootDir.length + 1)
  return { name: match[1], relativePath }
}

function depthOfPath(path: string) {
  return path.split('/').length
}

function parentPathOfDepth(depth: number) {
  const parts: string[] = []
  for (let i = 0; i < depth; i++) {
    parts.push('..')
  }
  return parts.join('/')
}

function fileUrlForDependency(
  myWorkspacePackage: WorkspaceDependency,
  dependency: WorkspaceDependency,
) {
  const depthOfMyPath = depthOfPath(myWorkspacePackage.relativePath)
  const parentPath = parentPathOfDepth(depthOfMyPath)
  console.log({ myWorkspacePackage, dependency, depthOfMyPath, parentPath })
  return `file:${parentPath}/${dependency.relativePath}`
}

function mandatoryDependency(
  allWorkspaceDependencies: WorkspaceDependency[],
  dependencyName: string,
) {
  const dependency = allWorkspaceDependencies.find((d) => d.name === dependencyName)
  if (dependency === undefined) {
    const allDependencyNames = allWorkspaceDependencies.map((d) => d.name)
    throw new Error(
      `Didn't find dependency named '${dependencyName}' in available dependencies ${allDependencyNames}`,
    )
  }
  return dependency
}

function localiseDependency(
  rootDir: string,
  myWorkspacePackage: WorkspaceDependency,
  allWorkspaceDependencies: WorkspaceDependency[],
  dependencyName: string,
) {
  const dependency = mandatoryDependency(allWorkspaceDependencies, dependencyName)
  return fileUrlForDependency(myWorkspacePackage, dependency)
}

function localiseDependencies(
  rewriter: WorkspaceDependencyRewriter,
  dependencies: Dependencies,
): Dependencies {
  return Object.keys(dependencies).reduce((acc, key) => {
    const dependency = dependencies[key]
    try {
      acc[key] = dependency === 'workspace:*' ? rewriter(key) : dependency
    } catch (e: any) {
      e.message = `While localising dependency ${key} in dependencies ${JSON.stringify(
        dependencies,
      )}: ${e.message}`
      throw e
    }
    return acc
  }, {} as Dependencies)
}

function rewriteWorkspaceDependencies(
  rewriter: WorkspaceDependencyRewriter,
  packageJson: PackageJson,
): PackageJson {
  return {
    ...packageJson,
    dependencies: packageJson.dependencies
      ? localiseDependencies(rewriter, packageJson.dependencies)
      : {},
    devDependencies: packageJson.devDependencies
      ? localiseDependencies(rewriter, packageJson.devDependencies)
      : {},
  }
}

async function localiseWorkspaceDependency(
  rootDir: string,
  myWorkspacePackage: WorkspaceDependency,
  dep: WorkspaceDependency,
  allWorkspaceDependencies: WorkspaceDependency[],
) {
  const destDir = `${functionDir}/staging/local_deps/${dep.relativePath}`
  const sourceDir = `${rootDir}/${dep.relativePath}`
  await shell(`mkdir -p ${destDir}`)
  const pkgJson = readPackageJson(`${sourceDir}/package.json`)
  if (pkgJson.files) {
    for (let file of pkgJson.files) {
      if (file.endsWith('/')) {
        file = file.substring(0, file.length - 1)
      }

      await shell(`cp -r ${sourceDir}/${file} ${destDir}`)
    }
  }
  // await shell(`cp -r ${sourceDir}/dist ${destDir}`)
  const packageJson = rewriteWorkspaceDependencies(
    makeLocalDepsRewriter(rootDir, dep, allWorkspaceDependencies),
    readPackageJson(`${sourceDir}/package.json`),
  )
  fs.writeFileSync(`${destDir}/package.json`, JSON.stringify(packageJson, null, 2))
}

type WorkspaceDependencyRewriter = (dependencyName: string) => string

function makeLocalDepsRewriter(
  rootDir: string,
  myWorkspacePackage: WorkspaceDependency,
  allWorkspaceDependencies: WorkspaceDependency[],
): WorkspaceDependencyRewriter {
  return (dependencyName) =>
    localiseDependency(rootDir, myWorkspacePackage, allWorkspaceDependencies, dependencyName)
}

function makeToplevelPackageJsonRewriter(
  allWorkspaceDependencies: WorkspaceDependency[],
): WorkspaceDependencyRewriter {
  return (dependencyName) => {
    const dependency = mandatoryDependency(allWorkspaceDependencies, dependencyName)
    return `file:./local_deps/${dependency.relativePath}`
  }
}

async function main() {
  await shell(`mkdir -p ${functionDir}/staging/local_deps`)
  const buildOutput = await shell(`cd ../../ && pnpm run build --filter=${pkg.name}`).then(
    splitLines,
  )
  const buildCommandLines = filterBuildCommandLines(buildOutput)
  const rootDir = await findParent('pnpm-workspace.yaml')
  const allWorkspacePackages = buildCommandLines.map((bcl) =>
    workspaceDependencyFromBuildLine(rootDir, bcl),
  )
  const allWorkspaceDependencies = allWorkspacePackages.filter((p) => p.name !== pkg.name)
  console.log(`All workspace dependencies: ${JSON.stringify(allWorkspaceDependencies)}`)
  const myWorkspacePackage = allWorkspacePackages.find((p) => p.name === pkg.name)
  if (myWorkspacePackage === undefined) {
    throw new Error(
      `Can't find my package (${pkg.name}) in workspace dependencies ${JSON.stringify(
        allWorkspacePackages,
      )}`,
    )
  }
  for (const dep of allWorkspaceDependencies) {
    try {
      await localiseWorkspaceDependency(rootDir, myWorkspacePackage, dep, allWorkspaceDependencies)
    } catch (e: any) {
      e.message = `While localising workspace dependency ${JSON.stringify(dep)}: ${e.message}`
      throw e
    }
  }
  await shell(`cp -r ${functionDir}/src ${functionDir}/staging`)
  await shell(`cp ${functionDir}/tsconfig.json ${functionDir}/staging`)
  const packageJson = rewriteWorkspaceDependencies(
    makeToplevelPackageJsonRewriter(allWorkspaceDependencies),
    readPackageJson(`${functionDir}/package.json`),
  )
  fs.writeFileSync(`${functionDir}/staging/package.json`, JSON.stringify(packageJson, null, 2))
}

main().catch((err) => console.error(err))
