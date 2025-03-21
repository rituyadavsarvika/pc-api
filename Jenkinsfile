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
                script {
                    echo "Checking if build script exists..."
                    def hasBuildScript = sh(script: "jq -r '.scripts.build // empty' package.json", returnStdout: true).trim()
                    
                    if (hasBuildScript) {
                        echo "Running npm build..."
                        sh 'npm run build'
                    } else {
                        echo "No build script found, skipping build step."
                    }
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
                            sudo apt update &&
                            sudo apt install -y nodejs npm &&
                            sudo npm install -g pm2 &&
                            mkdir -p ${DEPLOY_PATH} &&
                            rm -rf ${DEPLOY_PATH}/*'
                        """
                        sh "scp -r * ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/"
                    }
                }
            }
        }

        stage('Start Application with PM2') {
    steps {
        script {
            echo "Starting application with PM2..."
            sshagent(['YOUR_SSH_CREDENTIAL_ID']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                    cd ${DEPLOY_PATH} &&
                    npm install &&
                    if pm2 list | grep -q ${APP_NAME}; then
                        echo "🔄 Restarting existing PM2 process..."
                        pm2 restart ${APP_NAME}
                    else
                        echo "🚀 Starting new PM2 process..."
                        pm2 start src/app.js --name ${APP_NAME}
                    fi &&
                    pm2 save'
                """
            }
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
