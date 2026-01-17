import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export function createCloudFrontDistribution(scope: Construct, storage: any) {
  // Create shared cache policies
  const imageCachePolicy = new cloudfront.CachePolicy(scope, 'ImageCachePolicy', {
    cachePolicyName: 'ImageCachePolicy',
    comment: 'Medium-term caching for images',
    defaultTtl: Duration.days(7),
    maxTtl: Duration.days(30),
    minTtl: Duration.hours(1),
    cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept'),
    queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('w', 'h', 'q'),
    enableAcceptEncodingGzip: true,
    enableAcceptEncodingBrotli: true,
  });

  // Create CloudFront distribution for optimized content delivery
  const distribution = new cloudfront.Distribution(scope, 'HealthcareAppDistribution', {
    defaultBehavior: {
      origin: new origins.S3Origin(storage.resources.bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: new cloudfront.CachePolicy(scope, 'HealthcareAppCachePolicy', {
        cachePolicyName: 'HealthcareAppCachePolicy',
        comment: 'Cache policy for healthcare app static assets',
        defaultTtl: Duration.hours(24),
        maxTtl: Duration.days(365),
        minTtl: Duration.seconds(0),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
          'Authorization',
          'CloudFront-Forwarded-Proto',
          'CloudFront-Is-Desktop-Viewer',
          'CloudFront-Is-Mobile-Viewer',
          'CloudFront-Is-Tablet-Viewer'
        ),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
          'version',
          'locale'
        ),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }),
      responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(scope, 'HealthcareSecurityHeaders', {
        responseHeadersPolicyName: 'HealthcareSecurityHeaders',
        comment: 'Security headers for healthcare app',
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.seconds(31536000),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          contentSecurityPolicy: {
            contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com https://*.amplifyapp.com;",
            override: true,
          },
        },
        // Custom headers are configured in security headers above
      }),
    },
    additionalBehaviors: {
      // API requests should not be cached
      '/api/*': {
        origin: new origins.HttpOrigin('api.healthcare-app.com'),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      // GraphQL requests should have minimal caching
      '/graphql': {
        origin: new origins.HttpOrigin('api.healthcare-app.com'),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: new cloudfront.CachePolicy(scope, 'GraphQLCachePolicy', {
          cachePolicyName: 'GraphQLCachePolicy',
          comment: 'Minimal caching for GraphQL queries',
          defaultTtl: Duration.seconds(0),
          maxTtl: Duration.minutes(5),
          minTtl: Duration.seconds(0),
          cookieBehavior: cloudfront.CacheCookieBehavior.all(),
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
            'Authorization',
            'Content-Type',
            'x-api-key'
          ),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
        }),
      },
      // Static assets with long-term caching
      '*.js': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(scope, 'StaticAssetsCachePolicy', {
          cachePolicyName: 'StaticAssetsCachePolicy',
          comment: 'Long-term caching for static assets',
          defaultTtl: Duration.days(30),
          maxTtl: Duration.days(365),
          minTtl: Duration.days(1),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
          headerBehavior: cloudfront.CacheHeaderBehavior.none(),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('version'),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
      },
      '*.css': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(scope, 'CSSCachePolicy', {
          cachePolicyName: 'CSSCachePolicy',
          comment: 'Long-term caching for CSS assets',
          defaultTtl: Duration.days(30),
          maxTtl: Duration.days(365),
          minTtl: Duration.days(1),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
          headerBehavior: cloudfront.CacheHeaderBehavior.none(),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('version'),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        }),
      },
      // Images with medium-term caching
      '*.jpg': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
      '*.jpeg': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
      '*.png': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
      '*.gif': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
      '*.webp': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
      '*.svg': {
        origin: new origins.S3Origin(storage.resources.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: imageCachePolicy,
      },
    },
    // Enable HTTP/2 and HTTP/3
    httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    // Enable IPv6
    enableIpv6: true,
    // Price class for global distribution
    priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
    // Enable logging
    enableLogging: true,
    logBucket: new s3.Bucket(scope, 'CloudFrontLogsBucket', {
      bucketName: 'healthcare-app-cloudfront-logs',
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'DeleteOldLogs',
        expiration: Duration.days(90),
      }],
      removalPolicy: RemovalPolicy.DESTROY,
    }),
    logFilePrefix: 'cloudfront-logs/',
    // Geographic restrictions (if needed for compliance)
    geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA', 'GB', 'AU'),
    // Error pages
    errorResponses: [
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(5),
      },
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.minutes(5),
      },
    ],
  });

  return distribution;
}