//! Line-delimited stdio MCP server: reads JSON-RPC from stdin, writes responses to stdout.

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

use jarvis_mcp::handle_request;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let stdin = tokio::io::stdin();
    let mut stdout = tokio::io::stdout();
    let mut lines = BufReader::new(stdin).lines();
    while let Some(line) = lines.next_line().await? {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let Ok(request) = serde_json::from_str::<serde_json::Value>(line) else { continue };
        if let Some(response) = handle_request(&request) {
            stdout
                .write_all(format!("{}\n", serde_json::to_string(&response)?).as_bytes())
                .await?;
            stdout.flush().await?;
        }
    }
    Ok(())
}
