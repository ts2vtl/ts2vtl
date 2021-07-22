#!/usr/bin/env node
import { App } from "@aws-cdk/core";
import { TS2VTLExampleStack } from "./TS2VTLExampleStack";

export const app = new App();

new TS2VTLExampleStack(app, `TS2VTLExampleStack`);
