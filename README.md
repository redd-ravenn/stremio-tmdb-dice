# stremio-tmdb-dice

## Features

- Catalog that provides randomly selected content from TMDB based on filters
- Filterable by genres, rating ranges, and year ranges
- Integration with RPDB
- Integration with Fanart
- Caching system for content, Fanart, and RPDB
  
![Screenshot of the addon configuration page](https://i.imgur.com/OD7PFSq.png)

## Prerequisites

- **TMDB API Key**: You need to obtain a TMDB API key. You can get one [here](https://www.themoviedb.org/settings/api).

## Installation (with Docker)

```yaml
version: '3.8'

services:
  stremio-tmdb-dice:
    image: reddravenn/stremio-tmdb-dice
    ports:
      # Map port 8080 on the host to port 7000 in the container
      - "8080:7000"
    environment:
      # BASE_URL is the base URL for accessing the addon without a trailing slash.
      # Example: https://tmdb-dice.stremio
      # Ensure this URL is correctly configured for your environment.
      - BASE_URL=http://localhost:7000

      # Specifies the cache expiration duration for catalog content.
      # The format is either days or hours, e.g., '3d' for 3 days or '3h' for 3 hours.
      - CATALOG_CONTENT_CACHE_DURATION=3d

      # Specifies the cache expiration duration for RPDB posters.
      # The format is either days or hours, e.g., '3d' for 3 days or '3h' for 3 hours.
      - RPDB_POSTER_CACHE_DURATION=3d

      # The number of days after which application logs will be automatically deleted.
      # Set this to a suitable duration to manage log file size and retention.
      - LOG_INTERVAL_DELETION=3d

      # Defines the logging level for the application.
      # Set to "info" for standard logging or "debug" for more detailed logs.
      - LOG_LEVEL=info

      # The environment in which the application is running.
      # Typically set to "production" for live environments or "development" for testing and debugging.
      - NODE_ENV=production

      # The port on which the addon will listen for incoming connections.
      # Make sure this port is open and not used by other services.
      - PORT=7000
    volumes:
      # Defines a volume for storing data from the container on the host.
      # Replace /your/path/to/* with the path of your choice on the host where you want to store the data.
      - /your/path/to/db:/usr/src/app/db
      - /your/path/to/log:/usr/src/app/log
```

## Installation (without Docker)

1. **Obtain the TMDB API Key**: Visit [TMDB API Settings](https://www.themoviedb.org/settings/api) to get your API key.
2. **Clone the repository**: Clone this repository to your local machine.

    ```bash
    git clone https://github.com/redd-ravenn/stremio-tmdb-dice.git
    ```

3. **Install dependencies**:

    ```bash
    cd stremio-tmdb-dice
    npm install
    ```

4. **Start the application**:

    ```bash
    npm start
    ```

5. **Configure the addon**: Access the addon configuration interface via the link generated by the application.

## Contributing

Contributions are welcome! Please submit an [issue](https://github.com/redd-ravenn/stremio-tmdb-dice/issues) or a [pull request](https://github.com/redd-ravenn/stremio-tmdb-dice/pulls) if you have suggestions or fixes.

## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.
