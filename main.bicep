param location string = resourceGroup().location
param appName string = 'kerkplanner-api-${uniqueString(resourceGroup().id)}'
param sqlServerName string = 'kerkplanner-sql-${uniqueString(resourceGroup().id)}'
param sqlAdminUser string = 'sqladmin'
@secure()
param sqlAdminPassword string

// Free tier SQL Database
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminUser
    administratorLoginPassword: sqlAdminPassword
  }
}

resource sqlDB 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: 'KerkPlannerDb'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
}

// Allow Azure services to access SQL
resource sqlFirewall 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureIPs'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Free tier App Service Plan (F1)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'F1'
    tier: 'Free'
  }
}

// Web App (Backend API)
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      cors: {
        allowedOrigins: [
          'https://your-vercel-frontend-url.vercel.app'
        ]
      }
      appSettings: [
        {
          name: 'ConnectionStrings__DefaultConnection'
          value: 'Server=tcp:${sqlServer.name}${environment().suffixes.sqlServerHostname},1433;Initial Catalog=${sqlDB.name};Persist Security Info=False;User ID=${sqlAdminUser};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
      ]
    }
  }
}
