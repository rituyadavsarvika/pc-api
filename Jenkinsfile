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
                            mkdir -p ${DEPLOY_PATH} &&
                            rm -rf ${DEPLOY_PATH}/* &&
                            exit'
                        """
                        sh "scp -r * ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/"

                        echo "Installing PM2 and restarting the application..."
                        sh """
                            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            sudo apt update &&
                            sudo npm install -g pm2 &&
                            cd ${DEPLOY_PATH} &&
                            npm install &&
                            pm2 stop ${APP_NAME} || true &&
                            pm2 start server.js --name ${APP_NAME} &&
                            pm2 save &&
                            exit'
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
