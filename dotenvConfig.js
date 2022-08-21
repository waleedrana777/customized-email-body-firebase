module.exports = () => {
    const dotenv = require('dotenv')
    const path = require('path/posix')

    //path = current working directory / file name
    const localEnvPath = path.resolve(process.cwd(), '.env.local')
    //checks for .env.local and if it exists, loads it otherwise loads .env
    dotenv.config({ path: localEnvPath }) ? dotenv.config() : dotenv.config({ path: localEnvPath })
}
