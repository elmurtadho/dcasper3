Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "python discord_agent.py --loop --interval 300", 0, False
