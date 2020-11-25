/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ThemeService } from '@theia/core/lib/browser/theming';

const dark = require('../../src/browser/style/variables-dark.useable.css');
const light = require('../../src/browser/style/variables-light.useable.css');

function updateTheme(): void {
    const theme = ThemeService.get().getCurrentTheme().id;
    if (theme === 'dark') {
        light.unuse();
        dark.use();
    } else if (theme === 'light') {
        dark.unuse();
        light.use();
    }
}

updateTheme();

ThemeService.get().onThemeChange(() => updateTheme());
