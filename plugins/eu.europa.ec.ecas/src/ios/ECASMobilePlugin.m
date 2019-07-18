//
//  ECASMobilePlugin.m
//  ECASMobileClientSDK
//
//  Created by ECAS Development Team on 09/02/16.
//  Copyright © 2016 European Commission. All rights reserved.
//
#import <UIKit/UIKit.h>

#import "ECASMobilePlugin.h"
#import "ECASMobile.h"
#import "CASCommonUtils.h"

#import "CASAuthenticationView.h"

@interface ECASMobilePlugin() {
    CDVInvokedUrlCommand *currentCommand;
    UIView *container;
}

@property (strong, nonatomic) ECASClient *client;

@property (strong, nonatomic) UIActivityIndicatorView *progressView;
@property (strong, nonatomic) UINavigationBar *bar;
@property (strong, nonatomic) UIBarButtonItem *cancel;
@property (strong, nonatomic) UINavigationItem *navItem;


- (void) buildInvalidParameters:(NSArray *)parameters forCommand:(CDVInvokedUrlCommand *) command;
- (void) buildInvalidParameter:(NSString *)code atIndex:(int) index forCommand:(CDVInvokedUrlCommand *) command;
- (void) buildData:(NSDictionary *) data forCommand:(CDVInvokedUrlCommand *) command;
- (void) buildErrorMessage:(NSError *) error forCommand:(CDVInvokedUrlCommand *) command;
@end

@implementation ECASMobilePlugin
#pragma mark - Property getters
- (ECASClient *) client
{
    if(!_client)
    {
        _client = [ECASMobile sharedECASClient];
    }

    return _client;
}

#pragma mark - CasAuthenticationDelegate methods
- (void)casAuthenticated:(NSString *)user withData:(NSDictionary *)data ticket:(NSString *)ticket
{
    if(currentCommand) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"data" : data}];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
    }

    [self closeOverlay:self];
}

- (void) casAuthenticationFailed
{
    if(currentCommand) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsDictionary:@{@"error": @"EXCEPTION",
                                                                            @"exception": @"Failed to validate service ticket"}];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
    }

    [self closeOverlay:self];
}

#pragma mark - BarButton selector
- (void) closeOverlay:(id) sender
{
    if(container) {
        [container removeFromSuperview];
    }

    if(currentCommand) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsDictionary:@{@"error": @"AUTHENTICATION_CANCELLED"}];

        [self.commandDelegate sendPluginResult:pluginResult
                                    callbackId:currentCommand.callbackId];
    }
}

#pragma mark - Corodova Plugin methods
- (void) isECASMobileAppInstalled:(CDVInvokedUrlCommand *)command
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        CDVPluginResult *result = nil;

        if(self.client.isECASMobileAppInstalled) {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        } else {
            result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        }

        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    });
}

- (void) validateServiceTicket:(CDVInvokedUrlCommand *)command {
    const int PARAM_TICKET = 0;
    const int PARAM_SERVICE = 1;
    const int PARAM_ENV = 2;

    if(command.arguments.count  < 2 || command.arguments.count > 3)
    {
        //invalid number of arguments provided
        [self buildInvalidParameters:command.arguments forCommand:command];
    }
    else
    {
        NSString *serviceTicket = [command.arguments objectAtIndex:PARAM_TICKET];
        NSString *serviceUrl = [command.arguments objectAtIndex:PARAM_SERVICE];
        NSString *env = [command.arguments objectAtIndex:PARAM_ENV];

        NSURL *casEnv = self.client.configuration.ECASBaseURL;

        if(![CASCommonUtils isBlank:env])
            casEnv = [NSURL URLWithString:env];

        if([CASCommonUtils isBlank:serviceTicket]) {
            [self buildInvalidParameter:@"Service Ticket" atIndex:PARAM_TICKET forCommand:command];
        } else if([CASCommonUtils isBlank:serviceUrl]) {
            [self buildInvalidParameter:@"Service" atIndex:PARAM_SERVICE forCommand:command];
        } else if (!casEnv) {
            [self buildInvalidParameter:@"ECAS Environment" atIndex:-1 forCommand:command];
        } else {
            [self.client validateServiceTicket:serviceTicket
                                    forService:[NSURL URLWithString:serviceUrl]
                            withCasEnvironment:casEnv
                                     onSuccess:^(NSDictionary *data) {
                                         [self buildData:data forCommand:command];
                                     } onFailure:^(NSError *error) {
                                         [self buildErrorMessage:error forCommand:command];
                                     }];
        }
    }
}

- (void) requestDesktopProxyTicket:(CDVInvokedUrlCommand *)command
{
    const int INDEX_DPGT = 0;
    const int INDEX_SERVICE = 1;


    if(command.arguments.count != 2) {
        [self buildInvalidParameters:command.arguments forCommand:command];
    } else {
        NSURL *service = [NSURL URLWithString:[command.arguments objectAtIndex:INDEX_SERVICE]];
        NSString *dpgt = [command.arguments objectAtIndex:INDEX_DPGT];

        if([CASCommonUtils isBlank:dpgt]) {
            [self buildInvalidParameter:@"Desktop PGT" atIndex:INDEX_DPGT forCommand:command];
        } else if(!service) {
            [self buildInvalidParameter:@"Service URL" atIndex:INDEX_SERVICE forCommand:command];
        } else {
            [self.client requestDesktopProxyTicketForService:service
                                  usingDesktopGrantingTicket:dpgt
                                                   onSuccess:^(NSDictionary *data) {
                                                       [self buildData:data forCommand:command];
                                                   } onFailure:^(NSError *error) {
                                                       [self buildErrorMessage:error forCommand:command];
                                                   }];
        }
    }
}

- (void) requestECASAuthentication:(CDVInvokedUrlCommand *)command
{
    currentCommand = command;
    // NSURL *service = [NSURL URLWithString:@"http://localhost/cordova"];
    UIView *rootView = self.viewController.view;

    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];


    // if the container was added before, remove from the superview and removed the observers
    if(container) {
        [container removeFromSuperview];
        container = nil;

        [nc removeObserver:self name:ECAS_WEBVIEW_PAGE_LOAD_START object:nil];
        [nc removeObserver:self name:ECAS_WEBVIEW_PAGE_LOAD_COMPLETED object:nil];
    }

    [nc addObserver:self selector:@selector(showWait:) name:ECAS_WEBVIEW_PAGE_LOAD_START object:nil];
    [nc addObserver:self selector:@selector(hideWait:) name:ECAS_WEBVIEW_PAGE_LOAD_COMPLETED object:nil];


    // create a new container with a navigation bar
    container = [[UIView alloc] initWithFrame:rootView.frame];

    self.bar = [[UINavigationBar alloc] initWithFrame:CGRectMake(0, 0, rootView.frame.size.width, 50)];
    [container addSubview:self.bar];

    self.cancel = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel target:self action:@selector(closeOverlay:)];
    self.navItem = [[UINavigationItem alloc] initWithTitle:@"ECAS"];
    [self.navItem setRightBarButtonItem:self.cancel animated:YES];

    [self.bar setItems:@[self.navItem] animated:YES];


    // define the dimensions for the authenticationView
    CGRect webviewFrame = rootView.frame;
    webviewFrame.size.height -= self.bar.frame.size.height;
    webviewFrame.origin.y += self.bar.frame.size.height;

    CASAuthenticationView *authenticationView = [[CASAuthenticationView alloc] initWithFrame:webviewFrame];
    authenticationView.casAuthenticationDelegate = self;

    // add the subviews
    [container addSubview:authenticationView];
    [rootView addSubview:container];

    // show the login page
    [authenticationView requestCASAuthentication];
}

- (void) showWait:(NSNotification *) notification
{
    NSLog(@"Show wait for %@", notification.object);

    if(self.progressView == nil) {
        self.progressView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
        UIBarButtonItem *item = [[UIBarButtonItem alloc] initWithCustomView:self.progressView];

        self.navItem.leftBarButtonItem = item;
    }

    self.progressView.hidden = false;
    [self.progressView startAnimating];
}

- (void) hideWait:(NSNotification *) notification
{
    NSLog(@"Hide wait for %@", notification.object);

    [self.progressView stopAnimating];
    self.progressView.hidden = true;
}

- (void) requestECASMobileAppAuthentication:(CDVInvokedUrlCommand *)command
{
    const int INDEX_SERVICE = 0;

    if(command.arguments.count != 1)
    {
        [self buildInvalidParameters:command.arguments forCommand:command];
    }
    else
    {
        NSURL *uri = [NSURL URLWithString:[command.arguments objectAtIndex:INDEX_SERVICE]];

        if(!uri)
        {
            [self buildInvalidParameter:@"Service URL" atIndex:INDEX_SERVICE forCommand:command];
        }
        else
        {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                [self.client requestECASMobileAppAuthenticationForUri:uri];
            });


            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];

            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }
    }
}

#pragma mark - Local interface implementation
- (void) buildData:(NSDictionary *) data forCommand:(CDVInvokedUrlCommand *) command
{
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{@"data": data}];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) buildErrorMessage:(NSError *)error forCommand:(CDVInvokedUrlCommand *)command {
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                            messageAsDictionary:@{@"error": @"EXCEPTION",
                                                                  @"exception": error.description}];

    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) buildInvalidParameters:(NSArray *)parameters forCommand:(CDVInvokedUrlCommand *) command
{
    NSMutableDictionary *result = [[NSMutableDictionary alloc] init];

    int i=0;
    for (NSString *val in parameters) {
        [result setValue:val forKey:[NSString stringWithFormat:@"PARAM%d", i]];
        i++;
    }

    CDVPluginResult *cbResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                              messageAsDictionary:@{@"error" : @"INVALID_PARAMETERS",
                                                                    @"params" : [result copy]}];

    [self.commandDelegate sendPluginResult:cbResult callbackId:command.callbackId];
}

- (void) buildInvalidParameter:(NSString *)code atIndex:(int)index forCommand:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *cbResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                              messageAsDictionary:@{@"error" : @"INVALID_PARAMETER",
                                                                    @"index" : @(index),
                                                                    @"code"  : code}];

    [self.commandDelegate sendPluginResult:cbResult callbackId:command.callbackId];
}
@end
