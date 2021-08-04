export async function run(...cmd: string[]): Promise<string> {
  // run child proc
  const proc = Deno.run({ cmd, stdout: "piped" })

  // decode the output
  const buffer = await proc.output()
  const string = new TextDecoder("utf-8").decode(buffer)

  // close child proc
  proc.close()

  return string
}
