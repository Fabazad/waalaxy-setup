## Installation

-   [Install docker](https://docs.docker.com/get-docker/)
-   [Setup ssh key for github](https://docs.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
-   Clone the waalaxy setup repository, this repository contains a script that clones all the repositories and a docker-compose referencing all the back end services.

```bash
git clone git@github.com:Waapi-Pro/spiderman.git
```

-   Start the setup command

```bash
npm run setup
```

-   This command will clone all the repositories, front and back. It also clones the service spiderman used for end to end testing.
