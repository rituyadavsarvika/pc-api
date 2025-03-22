pipeline {
    agent { label 'jenkins-runner1' }

    environment {
        DEPLOY_SERVER = "10.247.109.112"  
        DEPLOY_USER = "app" 
        DEPLOY_PATH = "/var/www/sample-node-project" 
        CREDENTIAL_ID = "app-server-app-user-ssh-key" 
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
                        sh "scp -r * ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/"
                        sh """
                            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} '
                            cd ${DEPLOY_PATH}
                            export NVM_DIR=~/.nvm &&
                            source ~/.nvm/nvm.sh
                            nvm install v18.20.7
                            npm install && 
                            pm2 restart ${APP_NAME} ||  pm2 start src/app.js --name ${APP_NAME} &&
                            pm2 save
                            '  
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
