pipeline {
    agent { label 'jenkins-runner1' }

    environment {
        DEPLOY_SERVER = "10.247.109.112"  
        DEPLOY_USER = "ubuntu" 
        DEPLOY_PATH = "/var/www/sample-node-project" 
        CREDENTIAL_ID = "app-server-ssh-key" 
        APP_NAME = "sample-node-app"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                nodejs('nodejs18') {
                    echo "Installing dependencies"
                    sh 'npm install'
                }
            }
        }

        stage('Build Application') {
            steps {
                nodejs('nodejs18') {
                    echo "Building Code"
                }
            }
        }

        stage('Deploy to Server') {
    steps {
        script {
            echo "Deploying application to EC2..."
            sshagent([CREDENTIAL_ID]) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                    # Install Node.js and npm if not installed
                    if ! command -v node &> /dev/null; then
                        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                    fi
                    
                    # Install PM2 globally if not installed
                    if ! command -v pm2 &> /dev/null; then
                        sudo npm install -g pm2
                    fi

                    # Ensure deployment directory exists
                    mkdir -p ${DEPLOY_PATH} &&
                    rm -rf ${DEPLOY_PATH}/* &&
                    exit'
                """
                sh "scp -r * ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/"
                
                // Start the application using PM2
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                    cd ${DEPLOY_PATH} &&
                    pm2 stop all || true &&
                    pm2 start index.js --name sample-node-app &&
                    pm2 save &&
                    exit'
                """
            }
        }
    }
}

    post {
        success {
            echo '✅ Deployment completed successfully!'
        }
        failure {
            echo '❌ Deployment failed! Please check the logs.'
        }
    }
}
