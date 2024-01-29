class CustomConsole {
  getTimestamp(): string {
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
  }
  log(message?: any, ...optionalParams: any[]): void {
    console.log(
      "[CodeCoverageLcov " + this.getTimestamp() + "] " + message,
      ...optionalParams
    );
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(
      "[CodeCoverageLcov " + this.getTimestamp() + "] " + message,
      ...optionalParams
    );
  }
}

export var custom: CustomConsole = new CustomConsole();
