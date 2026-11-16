//! 仓库自动化入口：`cargo xtask <task>`。

use std::path::PathBuf;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "xtask", about = "MyJarvis repository automation")]
struct Cli {
    #[command(subcommand)]
    task: Task,
}

#[derive(Subcommand)]
enum Task {
    /// 从 jarvis-core 能力目录导出 JSON 清单（供 types 包与 MCP 消费）
    Schema {
        /// 输出文件路径；缺省打印到 stdout
        #[arg(short, long)]
        out: Option<PathBuf>,
    },
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    match cli.task {
        Task::Schema { out } => {
            let catalog = jarvis_core::capability_catalog();
            let json = serde_json::to_string_pretty(&catalog)?;
            match out {
                Some(path) => std::fs::write(&path, json)?,
                None => println!("{json}"),
            }
        }
    }
    Ok(())
}
