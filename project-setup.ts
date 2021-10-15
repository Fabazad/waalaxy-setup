import { exec, ExecOptions } from 'child_process';
import { ensureDir } from 'fs-extra';

type RepositorySetup = {
    url: string;
    setupCommand: string;
    folderName: string;
    developingBranch: string;
    basePath: string;
};

type Repositories = { [key: string]: RepositorySetup };

const repositories: Repositories = {
    goulag: {
        url: 'git@github.com:Waapi-Pro/goulag.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'goulag',
        basePath: 'back/services',
    },
    stargate: {
        url: 'git@github.com:Waapi-Pro/stargate.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'stargate',
        basePath: 'back/services',
    },
    profesor: {
        url: 'git@github.com:Waapi-Pro/profesor.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'profesor',
        basePath: 'back/services',
    },
    otto: {
        url: 'git@github.com:Waapi-Pro/otto.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'otto',
        basePath: 'back/services',
    },
    shiva: {
        url: 'git@github.com:Waapi-Pro/shiva.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'shiva',
        basePath: 'back/services',
    },
    hermes: {
        url: 'git@github.com:Waapi-Pro/hermes.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'hermes',
        basePath: 'back/services',
    },
    lilith: {
        url: 'git@github.com:Waapi-Pro/lilith.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'lilith',
        basePath: 'back/services',
    },
    janus: {
        url: 'git@github.com:Waapi-Pro/janus.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'janus',
        basePath: 'back/services',
    },
    voltaire: {
        url: 'git@github.com:Waapi-Pro/voltaire.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'voltaire',
        basePath: 'back/services',
    },
    zilean: {
        url: 'git@github.com:Waapi-Pro/zilean.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'zilean',
        basePath: 'back/services',
    },
    enutrof: {
        url: 'git@github.com:Waapi-Pro/enutrof.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'enutrof',
        basePath: 'back/services',
    },
    'otto-client': {
        url: 'git@github.com:Waapi-Pro/otto-client.git',
        developingBranch: 'master',
        setupCommand: 'npm install',
        folderName: 'otto-client',
        basePath: 'back/packages',
    },
    gaia: {
        url: 'git@github.com:Waapi-Pro/revenant-gaia.git',
        developingBranch: 'main',
        setupCommand: 'npm install',
        folderName: 'gaia',
        basePath: 'back/packages',
    },
    zeus: {
        url: 'git@github.com:Waapi-Pro/revenant-zeus.git',
        developingBranch: 'main',
        setupCommand: 'npm install',
        folderName: 'zeus',
        basePath: 'back/packages',
    },
    'queue-manager': {
        url: 'git@github.com:Waapi-Pro/queue-manager.git',
        developingBranch: 'master',
        setupCommand: 'npm install',
        folderName: 'queue-manager',
        basePath: 'back/packages',
    },
    'goulag-client': {
        url: 'git@github.com:Waapi-Pro/goulag-client.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'goulag-client',
        basePath: 'back/packages',
    },
    spiderman: {
        url: 'git@github.com:Waapi-Pro/spiderman.git',
        developingBranch: 'master',
        setupCommand: 'npm install',
        folderName: 'spiderman',
        basePath: './',
    },
    mystique: {
        url: 'git@github.com:Waapi-Pro/mystique.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'mystique',
        basePath: 'front/services',
    },
    mew: {
        url: 'git@github.com:Waapi-Pro/mew.git',
        developingBranch: 'develop',
        setupCommand: 'npm run install:all',
        folderName: 'mew',
        basePath: 'front/services',
    },
    girbal: {
        url: 'git@github.com:Waapi-Pro/girbal.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'girbal',
        basePath: 'front/packages',
    },
    'private-linkedin-api-client': {
        url: 'git@github.com:Waapi-Pro/private-linkedin-api-client.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'private-linkedin-api-client',
        basePath: 'front/packages',
    },
    'waap-ui': {
        url: 'git@github.com:Waapi-Pro/waap-ui.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'waap-ui',
        basePath: 'front/packages',
    },
    bouncer: {
        url: 'git@github.com:Waapi-Pro/bouncer.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'bouncer',
        basePath: 'back/services',
    },
    hawking: {
        url: 'git@github.com:Waapi-Pro/hawking.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'hawking',
        basePath: 'back/services',
    },
    'bouncer-client': {
        url: 'git@github.com:Waapi-Pro/bouncer-client.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'bouncer-client',
        basePath: 'back/packages',
    },
    'shiva-client': {
        url: 'git@github.com:Waapi-Pro/shiva-client.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'shiva-client',
        basePath: 'back/packages',
    },
    'otto-ui': {
        url: 'git@github.com:Waapi-Pro/otto-ui.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'otto-ui',
        basePath: 'front/services',
    },
    crypto: {
        url: 'git@github.com:Waapi-Pro/crypto.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'crypto',
        basePath: 'back/services',
    },
    pictochat: {
        url: 'git@github.com:Waapi-Pro/pictochat.git',
        developingBranch: 'develop',
        setupCommand: 'npm install',
        folderName: 'pictochat',
        basePath: 'back/services',
    }
};

const execCommand = (command: string, options: ExecOptions): Promise<true> => {
    return new Promise((resolve, reject) => {
        exec(command, options, function (error, stdout, stderr) {
            if (error) return reject(error);
            console.log(stdout);
            console.log(stderr);
            return resolve(true);
        });
    });
};

const clone = (url: string, folderName: string, cwd = './'): Promise<true> => execCommand(`git clone ${url} ${folderName}`, { cwd });

const setupRepository = async (setup: RepositorySetup) => {
    try {
        await ensureDir(`./${setup.basePath}`);
        await clone(setup.url, setup.folderName, `./${setup.basePath}`);
        await execCommand(`git checkout ${setup.developingBranch}`, { cwd: `./${setup.basePath}/${setup.folderName}` });
        await execCommand(setup.setupCommand, { cwd: `./${setup.basePath}/${setup.folderName}` });
    } catch (e) {
        console.log(e);
    }
};

const setupRepositories = (repos: Repositories): Promise<Array<void>> => {
    return Promise.all(
        Object.entries(repos).map(async ([name, setup]) => {
            console.log(`Setting up ${name}`);
            await setupRepository(setup);
            console.log(`${name} set up`);
        }),
    );
};

console.time();
setupRepositories(repositories).then(() => console.timeEnd());
