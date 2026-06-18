import subprocess, os, sys

token = os.environ.get("CLOUDFLARE_API_TOKEN")
account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "35a4a532ecf9f4395655b0acf8820387")

if not token:
    print("ERROR: Set CLOUDFLARE_API_TOKEN env var", file=sys.stderr)
    sys.exit(1)

env = os.environ.copy()
env["CLOUDFLARE_API_TOKEN"] = token
env["CLOUDFLARE_ACCOUNT_ID"] = account

print("=== Building with opennextjs-cloudflare ===")
build = subprocess.run(
    ["npx", "opennextjs-cloudflare", "build"],
    env=env, cwd="/root/hotel-checkin-app"
)
if build.returncode != 0:
    sys.exit(build.returncode)

print("=== Deploying with wrangler ===")
result = subprocess.run(
    ["npx", "wrangler", "deploy"],
    capture_output=True, text=True, env=env,
    cwd="/root/hotel-checkin-app", timeout=300
)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:], file=sys.stderr)
print("Return code:", result.returncode)
